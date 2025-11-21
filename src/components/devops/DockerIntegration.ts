/**
 * Docker Integration System
 * Professional Docker development tools:
 * - Dockerfile creation & editing with IntelliSense
 * - Docker Compose support
 * - Container management (start, stop, logs, exec)
 * - Image building & pushing
 * - Volume management
 * - Network management
 * - Docker registry integration
 * - Resource monitoring
 */

export enum ContainerStatus {
  RUNNING = 'running',
  STOPPED = 'stopped',
  PAUSED = 'paused',
  RESTARTING = 'restarting',
  EXITED = 'exited',
  CREATED = 'created',
}

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: ContainerStatus;
  created: Date;
  ports: PortMapping[];
  volumes: VolumeMount[];
  environment: Record<string, string>;
  networks: string[];
  stats?: ContainerStats;
}

export interface PortMapping {
  hostPort: number;
  containerPort: number;
  protocol: 'tcp' | 'udp';
}

export interface VolumeMount {
  source: string;
  destination: string;
  mode: 'rw' | 'ro';
}

export interface ContainerStats {
  cpuPercent: number;
  memoryUsage: number;
  memoryLimit: number;
  networkRx: number;
  networkTx: number;
  blockRead: number;
  blockWrite: number;
}

export interface DockerImage {
  id: string;
  repository: string;
  tag: string;
  size: number;
  created: Date;
  labels?: Record<string, string>;
}

export interface DockerVolume {
  name: string;
  driver: string;
  mountpoint: string;
  labels?: Record<string, string>;
  scope: 'local' | 'global';
}

export interface DockerNetwork {
  id: string;
  name: string;
  driver: string;
  scope: string;
  ipam: {
    subnet: string;
    gateway: string;
  };
}

export interface DockerComposeService {
  name: string;
  image?: string;
  build?: string;
  ports?: string[];
  volumes?: string[];
  environment?: Record<string, string>;
  depends_on?: string[];
  command?: string;
  networks?: string[];
}

export interface DockerComposeConfig {
  version: string;
  services: Record<string, DockerComposeService>;
  volumes?: Record<string, any>;
  networks?: Record<string, any>;
}

export class DockerIntegration {
  private containers: Map<string, DockerContainer> = new Map();
  private images: Map<string, DockerImage> = new Map();
  private volumes: Map<string, DockerVolume> = new Map();
  private networks: Map<string, DockerNetwork> = new Map();

  /**
   * List all containers
   */
  public async listContainers(all: boolean = false): Promise<DockerContainer[]> {
    try {
      const command = all ? 'docker ps -a --format json' : 'docker ps --format json';
      const output = await this.executeCommand(command);
      
      const containers = output.split('\n')
        .filter(line => line.trim())
        .map(line => this.parseContainerJson(line));

      // Update cache
      containers.forEach(container => {
        this.containers.set(container.id, container);
      });

      return containers;
    } catch (error) {
      console.error('Failed to list containers:', error);
      return [];
    }
  }

  /**
   * Start container
   */
  public async startContainer(containerId: string): Promise<void> {
    try {
      await this.executeCommand(`docker start ${containerId}`);
      
      const container = this.containers.get(containerId);
      if (container) {
        container.status = ContainerStatus.RUNNING;
      }
    } catch (error) {
      throw new Error(`Failed to start container: ${error}`);
    }
  }

  /**
   * Stop container
   */
  public async stopContainer(containerId: string, timeout: number = 10): Promise<void> {
    try {
      await this.executeCommand(`docker stop -t ${timeout} ${containerId}`);
      
      const container = this.containers.get(containerId);
      if (container) {
        container.status = ContainerStatus.STOPPED;
      }
    } catch (error) {
      throw new Error(`Failed to stop container: ${error}`);
    }
  }

  /**
   * Restart container
   */
  public async restartContainer(containerId: string): Promise<void> {
    try {
      await this.executeCommand(`docker restart ${containerId}`);
      
      const container = this.containers.get(containerId);
      if (container) {
        container.status = ContainerStatus.RUNNING;
      }
    } catch (error) {
      throw new Error(`Failed to restart container: ${error}`);
    }
  }

  /**
   * Remove container
   */
  public async removeContainer(containerId: string, force: boolean = false): Promise<void> {
    try {
      const cmd = force ? `docker rm -f ${containerId}` : `docker rm ${containerId}`;
      await this.executeCommand(cmd);
      this.containers.delete(containerId);
    } catch (error) {
      throw new Error(`Failed to remove container: ${error}`);
    }
  }

  /**
   * Get container logs
   */
  public async getContainerLogs(
    containerId: string,
    options?: {
      tail?: number;
      follow?: boolean;
      since?: string;
      timestamps?: boolean;
    }
  ): Promise<string> {
    try {
      let cmd = `docker logs ${containerId}`;
      
      if (options?.tail) cmd += ` --tail ${options.tail}`;
      if (options?.follow) cmd += ` -f`;
      if (options?.since) cmd += ` --since ${options.since}`;
      if (options?.timestamps) cmd += ` -t`;

      return await this.executeCommand(cmd);
    } catch (error) {
      throw new Error(`Failed to get logs: ${error}`);
    }
  }

  /**
   * Execute command in container
   */
  public async execInContainer(
    containerId: string,
    command: string,
    interactive: boolean = false
  ): Promise<string> {
    try {
      const cmd = interactive 
        ? `docker exec -it ${containerId} ${command}`
        : `docker exec ${containerId} ${command}`;
      
      return await this.executeCommand(cmd);
    } catch (error) {
      throw new Error(`Failed to execute command: ${error}`);
    }
  }

  /**
   * Get container stats
   */
  public async getContainerStats(containerId: string): Promise<ContainerStats> {
    try {
      const output = await this.executeCommand(`docker stats ${containerId} --no-stream --format json`);
      return this.parseStatsJson(output);
    } catch (error) {
      throw new Error(`Failed to get stats: ${error}`);
    }
  }

  /**
   * Build Docker image
   */
  public async buildImage(
    contextPath: string,
    options: {
      tag?: string;
      dockerfile?: string;
      buildArgs?: Record<string, string>;
      noCache?: boolean;
      target?: string;
    } = {}
  ): Promise<string> {
    try {
      let cmd = `docker build ${contextPath}`;
      
      if (options.tag) cmd += ` -t ${options.tag}`;
      if (options.dockerfile) cmd += ` -f ${options.dockerfile}`;
      if (options.noCache) cmd += ` --no-cache`;
      if (options.target) cmd += ` --target ${options.target}`;
      
      if (options.buildArgs) {
        Object.entries(options.buildArgs).forEach(([key, value]) => {
          cmd += ` --build-arg ${key}=${value}`;
        });
      }

      const output = await this.executeCommand(cmd);
      
      // Extract image ID from output
      const match = output.match(/Successfully built ([a-f0-9]+)/);
      return match ? match[1] : '';
    } catch (error) {
      throw new Error(`Failed to build image: ${error}`);
    }
  }

  /**
   * Push image to registry
   */
  public async pushImage(imageName: string): Promise<void> {
    try {
      await this.executeCommand(`docker push ${imageName}`);
    } catch (error) {
      throw new Error(`Failed to push image: ${error}`);
    }
  }

  /**
   * Pull image from registry
   */
  public async pullImage(imageName: string): Promise<void> {
    try {
      await this.executeCommand(`docker pull ${imageName}`);
      await this.refreshImages();
    } catch (error) {
      throw new Error(`Failed to pull image: ${error}`);
    }
  }

  /**
   * List images
   */
  public async listImages(): Promise<DockerImage[]> {
    try {
      const output = await this.executeCommand('docker images --format json');
      
      const images = output.split('\n')
        .filter(line => line.trim())
        .map(line => this.parseImageJson(line));

      // Update cache
      images.forEach(image => {
        this.images.set(image.id, image);
      });

      return images;
    } catch (error) {
      console.error('Failed to list images:', error);
      return [];
    }
  }

  /**
   * Remove image
   */
  public async removeImage(imageId: string, force: boolean = false): Promise<void> {
    try {
      const cmd = force ? `docker rmi -f ${imageId}` : `docker rmi ${imageId}`;
      await this.executeCommand(cmd);
      this.images.delete(imageId);
    } catch (error) {
      throw new Error(`Failed to remove image: ${error}`);
    }
  }

  /**
   * Create volume
   */
  public async createVolume(name: string, driver: string = 'local'): Promise<string> {
    try {
      await this.executeCommand(`docker volume create --driver ${driver} ${name}`);
      await this.refreshVolumes();
      return name;
    } catch (error) {
      throw new Error(`Failed to create volume: ${error}`);
    }
  }

  /**
   * List volumes
   */
  public async listVolumes(): Promise<DockerVolume[]> {
    try {
      const output = await this.executeCommand('docker volume ls --format json');
      
      const volumes = output.split('\n')
        .filter(line => line.trim())
        .map(line => this.parseVolumeJson(line));

      // Update cache
      volumes.forEach(volume => {
        this.volumes.set(volume.name, volume);
      });

      return volumes;
    } catch (error) {
      console.error('Failed to list volumes:', error);
      return [];
    }
  }

  /**
   * Remove volume
   */
  public async removeVolume(volumeName: string): Promise<void> {
    try {
      await this.executeCommand(`docker volume rm ${volumeName}`);
      this.volumes.delete(volumeName);
    } catch (error) {
      throw new Error(`Failed to remove volume: ${error}`);
    }
  }

  /**
   * Create network
   */
  public async createNetwork(
    name: string,
    driver: string = 'bridge',
    subnet?: string
  ): Promise<string> {
    try {
      let cmd = `docker network create --driver ${driver}`;
      if (subnet) cmd += ` --subnet ${subnet}`;
      cmd += ` ${name}`;
      
      const output = await this.executeCommand(cmd);
      await this.refreshNetworks();
      return output.trim();
    } catch (error) {
      throw new Error(`Failed to create network: ${error}`);
    }
  }

  /**
   * List networks
   */
  public async listNetworks(): Promise<DockerNetwork[]> {
    try {
      const output = await this.executeCommand('docker network ls --format json');
      
      const networks = output.split('\n')
        .filter(line => line.trim())
        .map(line => this.parseNetworkJson(line));

      // Update cache
      networks.forEach(network => {
        this.networks.set(network.id, network);
      });

      return networks;
    } catch (error) {
      console.error('Failed to list networks:', error);
      return [];
    }
  }

  /**
   * Docker Compose operations
   */
  public async composeUp(
    composePath: string,
    options?: {
      detach?: boolean;
      build?: boolean;
      forceRecreate?: boolean;
    }
  ): Promise<void> {
    try {
      let cmd = `docker-compose -f ${composePath} up`;
      
      if (options?.detach) cmd += ' -d';
      if (options?.build) cmd += ' --build';
      if (options?.forceRecreate) cmd += ' --force-recreate';

      await this.executeCommand(cmd);
    } catch (error) {
      throw new Error(`Failed to start compose services: ${error}`);
    }
  }

  /**
   * Docker Compose down
   */
  public async composeDown(
    composePath: string,
    options?: {
      volumes?: boolean;
      removeOrphans?: boolean;
    }
  ): Promise<void> {
    try {
      let cmd = `docker-compose -f ${composePath} down`;
      
      if (options?.volumes) cmd += ' -v';
      if (options?.removeOrphans) cmd += ' --remove-orphans';

      await this.executeCommand(cmd);
    } catch (error) {
      throw new Error(`Failed to stop compose services: ${error}`);
    }
  }

  /**
   * Generate Dockerfile
   */
  public generateDockerfile(
    baseImage: string,
    type: 'node' | 'python' | 'java' | 'go' | 'rust' | 'custom'
  ): string {
    const templates: Record<string, string> = {
      node: `FROM ${baseImage || 'node:18-alpine'}

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]`,

      python: `FROM ${baseImage || 'python:3.11-slim'}

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Start application
CMD ["python", "main.py"]`,

      java: `FROM ${baseImage || 'openjdk:17-slim'}

WORKDIR /app

# Copy jar file
COPY target/*.jar app.jar

# Expose port
EXPOSE 8080

# Start application
ENTRYPOINT ["java", "-jar", "app.jar"]`,

      go: `FROM ${baseImage || 'golang:1.21-alpine'} AS builder

WORKDIR /app

# Copy go mod files
COPY go.* ./
RUN go mod download

# Copy source code
COPY . .

# Build application
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Final stage
FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/main .

# Expose port
EXPOSE 8080

# Start application
CMD ["./main"]`,

      rust: `FROM ${baseImage || 'rust:1.73-alpine'} AS builder

WORKDIR /app

# Copy cargo files
COPY Cargo.* ./

# Copy source code
COPY . .

# Build application
RUN cargo build --release

# Final stage
FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/target/release/app .

# Expose port
EXPOSE 8080

# Start application
CMD ["./app"]`,
    };

    return templates[type] || '# Custom Dockerfile\nFROM ubuntu:latest\n';
  }

  /**
   * Generate Docker Compose file
   */
  public generateDockerCompose(config: DockerComposeConfig): string {
    const yaml = `version: '${config.version || '3.8'}'

services:
${this.generateServicesYaml(config.services)}

${config.volumes ? `volumes:\n${this.generateVolumesYaml(config.volumes)}` : ''}

${config.networks ? `networks:\n${this.generateNetworksYaml(config.networks)}` : ''}
`;
    return yaml;
  }

  /**
   * Parse Docker output helpers
   */

  private parseContainerJson(json: string): DockerContainer {
    const data = JSON.parse(json);
    return {
      id: data.ID || data.id,
      name: data.Names || data.name,
      image: data.Image,
      status: this.mapStatus(data.State || data.status),
      created: new Date(data.CreatedAt),
      ports: this.parsePorts(data.Ports),
      volumes: [],
      environment: {},
      networks: [],
    };
  }

  private parseImageJson(json: string): DockerImage {
    const data = JSON.parse(json);
    return {
      id: data.ID,
      repository: data.Repository,
      tag: data.Tag,
      size: parseInt(data.Size) || 0,
      created: new Date(data.CreatedAt),
    };
  }

  private parseVolumeJson(json: string): DockerVolume {
    const data = JSON.parse(json);
    return {
      name: data.Name,
      driver: data.Driver,
      mountpoint: data.Mountpoint,
      scope: 'local',
    };
  }

  private parseNetworkJson(json: string): DockerNetwork {
    const data = JSON.parse(json);
    return {
      id: data.ID,
      name: data.Name,
      driver: data.Driver,
      scope: data.Scope,
      ipam: {
        subnet: '',
        gateway: '',
      },
    };
  }

  private parseStatsJson(json: string): ContainerStats {
    const data = JSON.parse(json);
    return {
      cpuPercent: parseFloat(data.CPUPerc) || 0,
      memoryUsage: parseInt(data.MemUsage) || 0,
      memoryLimit: parseInt(data.MemLimit) || 0,
      networkRx: parseInt(data.NetIO?.split('/')[0]) || 0,
      networkTx: parseInt(data.NetIO?.split('/')[1]) || 0,
      blockRead: parseInt(data.BlockIO?.split('/')[0]) || 0,
      blockWrite: parseInt(data.BlockIO?.split('/')[1]) || 0,
    };
  }

  private parsePorts(portsStr: string): PortMapping[] {
    // Parse Docker ports string (e.g., "0.0.0.0:8080->80/tcp")
    const ports: PortMapping[] = [];
    if (!portsStr) return ports;

    const mappings = portsStr.split(',').map(p => p.trim());
    mappings.forEach(mapping => {
      const match = mapping.match(/(\d+)->(\d+)\/(tcp|udp)/);
      if (match) {
        ports.push({
          hostPort: parseInt(match[1]),
          containerPort: parseInt(match[2]),
          protocol: match[3] as 'tcp' | 'udp',
        });
      }
    });

    return ports;
  }

  private mapStatus(status: string): ContainerStatus {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('running')) return ContainerStatus.RUNNING;
    if (statusLower.includes('stop')) return ContainerStatus.STOPPED;
    if (statusLower.includes('pause')) return ContainerStatus.PAUSED;
    if (statusLower.includes('restart')) return ContainerStatus.RESTARTING;
    if (statusLower.includes('exit')) return ContainerStatus.EXITED;
    return ContainerStatus.CREATED;
  }

  private generateServicesYaml(services: Record<string, DockerComposeService>): string {
    let yaml = '';
    Object.entries(services).forEach(([name, service]) => {
      yaml += `  ${name}:\n`;
      if (service.image) yaml += `    image: ${service.image}\n`;
      if (service.build) yaml += `    build: ${service.build}\n`;
      if (service.ports) {
        yaml += `    ports:\n`;
        service.ports.forEach(port => yaml += `      - "${port}"\n`);
      }
      if (service.volumes) {
        yaml += `    volumes:\n`;
        service.volumes.forEach(vol => yaml += `      - ${vol}\n`);
      }
      if (service.environment) {
        yaml += `    environment:\n`;
        Object.entries(service.environment).forEach(([k, v]) => {
          yaml += `      ${k}: ${v}\n`;
        });
      }
      if (service.depends_on) {
        yaml += `    depends_on:\n`;
        service.depends_on.forEach(dep => yaml += `      - ${dep}\n`);
      }
      if (service.command) yaml += `    command: ${service.command}\n`;
    });
    return yaml;
  }

  private generateVolumesYaml(volumes: Record<string, any>): string {
    let yaml = '';
    Object.keys(volumes).forEach(name => {
      yaml += `  ${name}:\n`;
    });
    return yaml;
  }

  private generateNetworksYaml(networks: Record<string, any>): string {
    let yaml = '';
    Object.keys(networks).forEach(name => {
      yaml += `  ${name}:\n`;
    });
    return yaml;
  }

  private async refreshImages(): Promise<void> {
    await this.listImages();
  }

  private async refreshVolumes(): Promise<void> {
    await this.listVolumes();
  }

  private async refreshNetworks(): Promise<void> {
    await this.listNetworks();
  }

  private async executeCommand(command: string): Promise<string> {
    // Placeholder - would call backend Rust command
    console.log('Executing:', command);
    return '';
  }

  /**
   * Get all containers
   */
  public getAllContainers(): DockerContainer[] {
    return Array.from(this.containers.values());
  }

  /**
   * Get all images
   */
  public getAllImages(): DockerImage[] {
    return Array.from(this.images.values());
  }

  /**
   * Get all volumes
   */
  public getAllVolumes(): DockerVolume[] {
    return Array.from(this.volumes.values());
  }

  /**
   * Get all networks
   */
  public getAllNetworks(): DockerNetwork[] {
    return Array.from(this.networks.values());
  }
}

export default DockerIntegration;
